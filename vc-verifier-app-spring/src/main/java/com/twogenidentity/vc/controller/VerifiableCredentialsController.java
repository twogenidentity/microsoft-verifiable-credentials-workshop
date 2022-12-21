package com.twogenidentity.vc.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClient.Builder;
import org.springframework.web.server.ResponseStatusException;

import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import javax.servlet.http.HttpSession;
import java.io.*;
import java.nio.file.Files;

@Configuration
@RestController
public class VerifiableCredentialsController {

	private final Logger log = LoggerFactory.getLogger(this.getClass());

	@Value("${vc.presentation-uri}")
	private String vcPresentationUri;

	@Value("${vc.presentation-request}")
	private String vcPresentationRequest;

	@Autowired
	private CacheManager cache;

	@Value("classpath:did.json")
	Resource didResource;

	@Value("classpath:did-configuration.json")
	Resource didConfigurationResource;

	@Autowired
	ResourceLoader resourceLoader;

	@GetMapping("/.well-known/did.json")
	public ResponseEntity<String> did() throws IOException {

		try {
			log.debug("Getting did document: {}",  new String(Files.readAllBytes(didResource.getFile().toPath())));
		} catch (FileNotFoundException e) {
			log.debug(e.getMessage());
		}
		return ResponseEntity.ok().body(new String(Files.readAllBytes(didResource.getFile().toPath())));
	}

	@GetMapping("/.well-known/did-configuration.json")
	public ResponseEntity<String> didConfiguration() throws IOException {
		return ResponseEntity.ok().body(new String(Files.readAllBytes(didConfigurationResource.getFile().toPath())));
	}

	@GetMapping({"/api/vc/config"})
	public String issueConfig(@RegisteredOAuth2AuthorizedClient("azure")OAuth2AuthorizedClient authorizedClient)
	{
		log.debug("Step 1: Config vc uri {} ", vcPresentationUri);
		log.debug("Step 1: Config vc issuance template {} ", vcPresentationRequest);

		log.debug("Step 1: Config vc issuance request body {} ", String.format(vcPresentationRequest,
				"1234",   // callback.state
				"1234"));  // callback.header.api-key)

		log.debug("Step 1: AT {}" , authorizedClient.getAccessToken().getTokenValue());

		return "verifier";
	}

	@PostMapping({"/api/vc/presentation/callback"})
	public ResponseEntity<String> check(@RequestHeader(value="api-key") String apiKey, @RequestBody String body, HttpSession httpSession) throws JsonProcessingException {

		log.debug("Received issuance response with api-key: {}", apiKey  );
		log.debug("Presentation response body: {} ", body );
		ObjectMapper objectMapper = new ObjectMapper();
		JsonNode response = objectMapper.readTree(body);
		String requestId = response.path("requestId").asText();
		log.debug("Presentation response requestId: {} ", requestId );
		cache.getCache("vc").put(requestId, body);
		return ResponseEntity.noContent().build();
	}


	@GetMapping({"/api/vc/presentation/{id}"})
	public ResponseEntity<String> check(@PathVariable("id") String id, HttpSession httpSession)
	{
		String body = (cache.getCache("vc") != null && cache.getCache("vc").get(id) != null ? cache.getCache("vc").get(id).get().toString() : "{}");
		return ResponseEntity.ok().body(body);
	}

	@GetMapping({"/api/vc/presentation"})
	public Mono<String> presentation(@RegisteredOAuth2AuthorizedClient("azure")OAuth2AuthorizedClient authorizedClient)
	{
		String token =  authorizedClient.getAccessToken().getTokenValue();
		String body = String.format(vcPresentationRequest, "1234",  "1234");

		log.debug("Calling presentation uri {} with Header Bearer {} and body {}", vcPresentationUri , token, body);

		Builder builder = WebClient.builder()
				.baseUrl(vcPresentationUri)
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
		        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);

		WebClient client = builder.clientConnector(new ReactorClientHttpConnector(HttpClient.create().wiretap(true))).build();

		return client.post()
				.body(BodyInserters.fromValue(body))
				.retrieve()
				.onStatus(HttpStatus::is4xxClientError,
						clientResponse -> Mono.just(new ResponseStatusException(HttpStatus.FORBIDDEN, "You don't have access access to this resource")))
				.bodyToMono(String.class);
	}
}
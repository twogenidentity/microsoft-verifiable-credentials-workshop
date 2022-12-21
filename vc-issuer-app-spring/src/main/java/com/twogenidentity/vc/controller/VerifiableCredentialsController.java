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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClient.Builder;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.security.oauth2.client.web.reactive.function.client.ServerOAuth2AuthorizedClientExchangeFilterFunction.oauth2AuthorizedClient;

import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import javax.servlet.http.HttpSession;
import java.io.*;
import java.nio.file.Files;
import java.util.Map;

@Configuration
@RestController
public class VerifiableCredentialsController {

	private final Logger log = LoggerFactory.getLogger(this.getClass());

	@Value("${vc.issuance-uri}")
	private String vcIssuanceUri;

	@Value("${vc.issuance-request}")
	private String vcIssuanceRequest;

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
			log.debug("Getting did: {}",  new String(Files.readAllBytes(didResource.getFile().toPath())));
		} catch (FileNotFoundException e) {
			// throw new RuntimeException(e);
			log.debug(e.getMessage());
		}

		/**
		try {
			log.debug("Getting did from : {}",  ResourceUtils.getFile("classpath:did.json").toPath()  );
		} catch (FileNotFoundException e) {
			// throw new RuntimeException(e);
			log.debug(e.getMessage());
		}

		try {
			// log.debug("Getting did from : {}",  resourceLoader.getResource("classpath:did.json").getURI()  );
			File resource = new ClassPathResource("did.json").getFile();
			log.debug("resource {}", new String(
					Files.readAllBytes(resource.toPath())));
		} catch (FileNotFoundException e) {
			// throw new RuntimeException(e);
			log.debug(e.getMessage());
		} catch (IOException e) {
			// throw new RuntimeException(e);
			log.debug(e.getMessage());
		}

		InputStream resource = new ClassPathResource("did.json").getInputStream();
		try ( BufferedReader reader = new BufferedReader( new InputStreamReader(resource)) ) {
			String employees = reader.lines().collect(Collectors.joining("\n"));
			log.debug("stream: {}",employees);
		}}
		**/
		return ResponseEntity.ok().body(new String(Files.readAllBytes(didResource.getFile().toPath())));
	}

	@GetMapping("/.well-known/did-configuration.json")
	public ResponseEntity<String> didConfiguration() throws IOException {
		return ResponseEntity.ok().body(new String(Files.readAllBytes(didConfigurationResource.getFile().toPath())));
	}

	@GetMapping("/api/me")
	public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal OidcUser oauth2User) {
		return ResponseEntity.ok().body(oauth2User.getAttributes());
	}

	@PostMapping({"/api/vc/issuance/callback"})
	public ResponseEntity<String> check(@RequestHeader(value="api-key") String apiKey, @RequestBody String body, HttpSession httpSession) throws JsonProcessingException {

		log.debug("Received issuance response with api-key: {}", apiKey  ); //ToDo: Validate API Key
		log.debug("Issuance response body: {} ", body );
		ObjectMapper objectMapper = new ObjectMapper();
		JsonNode response = objectMapper.readTree(body);
		String requestId = response.path("requestId").asText();
		log.debug("Issuance response requestId: {} ", requestId );
		cache.getCache("vc").put(requestId, body);
		return ResponseEntity.noContent().build();
	}


	@GetMapping({"/api/vc/issuance/{id}"})
	public ResponseEntity<String> check(@PathVariable("id") String id, HttpSession httpSession)
	{
		String body = (cache.getCache("vc") != null && cache.getCache("vc").get(id) != null ? cache.getCache("vc").get(id).get().toString() : "{}");
		return ResponseEntity.ok().body(body);
	}

	@GetMapping({"/api/vc/issuance"})
	public Mono<String> issue(@RegisteredOAuth2AuthorizedClient("azure")OAuth2AuthorizedClient authorizedClient)
	{
		String token =  authorizedClient.getAccessToken().getTokenValue();
		String body = String.format(vcIssuanceRequest, "1234",  "1234"); //ToDo: Generate random state + api key

		log.debug("Calling issuance uri {} with Header Bearer {} and Body {}", vcIssuanceUri , token, body);

		Builder builder = WebClient.builder()
				.baseUrl(vcIssuanceUri)
				.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
		        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);

		WebClient client = builder.clientConnector(new ReactorClientHttpConnector(HttpClient.create().wiretap(true))).build();

		return client.post()
				.body(BodyInserters.fromValue(body))
				.retrieve()
				.onStatus(HttpStatus::is4xxClientError, //ToDo: Improve error handling
						clientResponse -> Mono.just(new ResponseStatusException(HttpStatus.FORBIDDEN, "You don't have access access to this resource")))
				.bodyToMono(String.class);
	}
}
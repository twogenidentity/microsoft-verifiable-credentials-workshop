package com.twogenidentity.vc.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

@EnableWebSecurity
@Configuration
// @EnableOAuth2Client
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
            //.antMatchers("/oauth2login").permitAll()
            .antMatchers("/").permitAll()
            .antMatchers("/js/**").permitAll()
            .antMatchers("/images/**").permitAll()
            .antMatchers("/.well-known/did.json").permitAll()
            .antMatchers("/.well-known/did-configuration.json").permitAll()
            .antMatchers("/api/vc/issuance/callback").permitAll()
            .anyRequest().authenticated()
            .and()
            .oauth2Login() //.loginPage("/oauth2login")
            .and()
            .logout()
                .and().exceptionHandling().accessDeniedPage("/error");

        http.csrf().ignoringAntMatchers("/api/vc/issuance/callback","/.well-known/did.json","/.well-known/did-configuration.json");
    }

}
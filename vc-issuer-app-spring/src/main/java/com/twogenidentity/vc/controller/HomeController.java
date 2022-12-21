package com.twogenidentity.vc.controller;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

	private final Logger log = LoggerFactory.getLogger(this.getClass());

	@GetMapping({"/", "issuer"})
	public String issuer(Model model) {
		return "issuer";
	}
}
package ia.quizapp.controller;
import org.springframework.web.bind.annotation.*;

import ia.quizapp.TestKey;
import ia.quizapp.repo.TestKeyRepository;
import ia.quizapp.service.TestKeyService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/test")
public class TestKeyController {

	 @Autowired
	    private TestKeyService testKeyService;

	    @GetMapping("/get-test-keys")
	    public List<String> getTestKeys() {
	        return testKeyService.getAllTestKeys();
	    }
}


package ia.quizapp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ia.quizapp.modal.User;
import ia.quizapp.repo.UserRepository;
import ia.quizapp.service.UserService;
import jakarta.validation.Valid;
import java.util.*;

@RestController
@RequestMapping("/user")  // Ensure separate endpoints for user-related actions
@CrossOrigin(origins = "*")
public class RegistrationController {

    private final UserRepository userRepository;
    @Autowired
    private UserService userService;

    public RegistrationController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerUser(@Valid @RequestBody User user) {
        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("message", "User registered successfully");

        return ResponseEntity.ok(response);
    }
    
}

package ia.quizapp.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ia.quizapp.modal.User;
import ia.quizapp.repo.UserRepository;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public void updateUserScore(Long userId, int newScore) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setScore(newScore);
        userRepository.save(user);
    }
    public User registerUser(User user) {
        // Check if email already exists
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        return userRepository.save(user);
    }
}

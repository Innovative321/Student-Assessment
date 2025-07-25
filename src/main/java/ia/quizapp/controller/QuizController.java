package ia.quizapp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ia.quizapp.modal.Question;
import ia.quizapp.modal.User;
import ia.quizapp.repo.QuestionRepository;
import ia.quizapp.repo.UserRepository;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/questions")  // Base endpoint for quiz operations
@CrossOrigin(origins = "*")  // Allow frontend access
public class QuizController {

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    @Autowired
    public QuizController(QuestionRepository questionRepository, UserRepository userRepository) {
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
    }
    
    @GetMapping("/")
    public ResponseEntity<List<Question>> getAllQuestions() {
        List<Question> questions = questionRepository.findAll();
        if (questions.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(questions);
    }
    
    @GetMapping("/category/{category}")
    public List<Question> getQuestionsByCategory(@PathVariable String category) {
        return questionRepository.findByCategory(category.toLowerCase());
    }

    @PostMapping("/submit-answer")
    public ResponseEntity<String> submitQuiz(@RequestBody Map<String, Object> payload) {
        
    	String userIdStr = String.valueOf(payload.get("userId"));

    	if (userIdStr == null || userIdStr.equals("undefined") || userIdStr.trim().isEmpty()) {
    	    return ResponseEntity.badRequest().body("Invalid or missing user ID.");
    	}
    	
        Map<String, Object> responses = (Map<String, Object>) payload.get("responses");

        int score = 0;

        for (Map.Entry<String, Object> entry : responses.entrySet()) {
            int questionId;
            try {
                questionId = Integer.parseInt(entry.getKey());
            } catch (NumberFormatException e) {
                continue;
            }

            Object selectedAnswerObj = entry.getValue();
            if (selectedAnswerObj == null) continue;

            List<String> selectedAnswers;
            if (selectedAnswerObj instanceof List<?>) {
                selectedAnswers = ((List<?>) selectedAnswerObj).stream()
                        .filter(Objects::nonNull)
                        .map(Object::toString)
                        .collect(Collectors.toList());
            } else {
                selectedAnswers = Collections.singletonList(selectedAnswerObj.toString());
            }

            Optional<Question> questionOpt = questionRepository.findById((long) questionId);
            if (questionOpt.isEmpty()) continue;

            Question question = questionOpt.get();

            List<Integer> correctIndexes = question.getCorrectAnswers(); // [0, 1, 3]

            List<Integer> selectedIndexes = new ArrayList<>();
            for (String selected : selectedAnswers) {
                if (selected.equals(question.getOption1())) selectedIndexes.add(0);
                else if (selected.equals(question.getOption2())) selectedIndexes.add(1);
                else if (selected.equals(question.getOption3())) selectedIndexes.add(2);
                else if (selected.equals(question.getOption4())) selectedIndexes.add(3);
            }

            if (new HashSet<>(correctIndexes).equals(new HashSet<>(selectedIndexes))) {
                score++;
            }
        }

        try {
            Long userId = Long.parseLong(userIdStr);

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setScore(score);
                userRepository.save(user);
                System.out.println("Score saved to user: " + user.getName());
            } else {
                System.out.println("User not found, score not saved.");
            }

        } catch (NumberFormatException e) {
            System.out.println("Invalid user ID format: " + userIdStr);
        }

        return ResponseEntity.ok("Quiz submitted successfully. Your score: " + score);
    }

//    @PostMapping("/submit-answer")
//    public ResponseEntity<String> submitQuiz(@RequestBody Map<String, Object> payload) {
//        String userIdOrEmail = (String) payload.get("userId");
//        Map<String, Object> responses = (Map<String, Object>) payload.get("responses");
//
//        int score = 0;
//
//        for (Map.Entry<String, Object> entry : responses.entrySet()) {
//            int questionId;
//            try {
//                questionId = Integer.parseInt(entry.getKey());
//            } catch (NumberFormatException e) {
//                continue;
//            }
//
//            Object selectedAnswerObj = entry.getValue();
//            if (selectedAnswerObj == null) continue;
//
//            List<String> selectedAnswers;
//            if (selectedAnswerObj instanceof List<?>) {
//                selectedAnswers = ((List<?>) selectedAnswerObj).stream()
//                        .filter(Objects::nonNull)
//                        .map(Object::toString)
//                        .collect(Collectors.toList());
//            } else {
//                selectedAnswers = Collections.singletonList(selectedAnswerObj.toString());
//            }
//
//            Optional<Question> questionOpt = questionRepository.findById((long) questionId);
//            if (questionOpt.isEmpty()) continue;
//
//            Question question = questionOpt.get();
//
//            List<Integer> correctIndexes = question.getCorrectAnswers(); // [0, 1, 3]
//
//            List<Integer> selectedIndexes = new ArrayList<>();
//            for (String selected : selectedAnswers) {
//                if (selected.equals(question.getOption1())) selectedIndexes.add(0);
//                else if (selected.equals(question.getOption2())) selectedIndexes.add(1);
//                else if (selected.equals(question.getOption3())) selectedIndexes.add(2);
//                else if (selected.equals(question.getOption4())) selectedIndexes.add(3);
//            }
//
//            if (new HashSet<>(correctIndexes).equals(new HashSet<>(selectedIndexes))) {
//                score++;
//            }
//        }
//
//        System.out.println("User " + userIdOrEmail + " scored: " + score);
//
//        // ✅ Update score in user table
//        Optional<User> userOpt = userRepository.findByEmail(userIdOrEmail); // or findById(Long.parseLong(userIdOrEmail))
//        if (userOpt.isPresent()) {
//            User user = userOpt.get();
//            user.setScore(score);
//            userRepository.save(user);
//            System.out.println("Score saved to user: " + user.getName());
//        } else {
//            System.out.println("User not found, score not saved.");
//        }
//
//        return ResponseEntity.ok("Quiz submitted successfully. Your score: " + score);
//    }
}

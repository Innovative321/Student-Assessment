package ia.quizapp.modal;

import java.util.*;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String question;
    private String option1;
    private String option2;
    private String option3;
    private String option4;
    private String correctAnswers;
    
    @Column(nullable = false)
    private String category;

	@Column(name = "is_multiple_choice")
    @JsonProperty("is_multiple_choice")
    private boolean isMultipleChoice;
    
//    private List<String> selectedAnswers;  // Accepting multiple answers

    // Getters and Setters
    public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}
//    public List<String> getSelectedAnswers() {
//        return selectedAnswers;
//    }
//
//    public void setSelectedAnswers(List<String> selectedAnswers) {
//        this.selectedAnswers = selectedAnswers;
//    }
    
    public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getQuestion() {
		return question;
	}
	public void setQuestion(String question) {
		this.question = question;
	}
	public String getOption1() {
		return option1;
	}
	public void setOption1(String option1) {
		this.option1 = option1;
	}
	public String getOption2() {
		return option2;
	}
	public void setOption2(String option2) {
		this.option2 = option2;
	}
	public String getOption3() {
		return option3;
	}
	public void setOption3(String option3) {
		this.option3 = option3;
	}
	public String getOption4() {
		return option4;
	}
	public void setOption4(String option4) {
		this.option4 = option4;
	}
	
	public List<Integer> getCorrectAnswers() {
	    if (correctAnswers == null || correctAnswers.trim().isEmpty()) {
	        return new ArrayList<>();
	    }
	    return Arrays.stream(correctAnswers.split(","))
	            .map(String::trim)
	            .map(Integer::parseInt)
	            .collect(Collectors.toList());
	}
	
	public void setCorrectAnswers(String correctAnswers) {
		this.correctAnswers = correctAnswers;
	}
	public boolean isMultipleChoice() {
		return isMultipleChoice;
	}
	public void setMultipleChoice(boolean isMultipleChoice) {
		this.isMultipleChoice = isMultipleChoice;
	}
	
}

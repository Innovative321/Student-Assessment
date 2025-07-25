package ia.quizapp.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ia.quizapp.modal.Question;

public interface QuestionRepository extends JpaRepository<Question, Long>{

	List<Question> findByCategory(String category);

}

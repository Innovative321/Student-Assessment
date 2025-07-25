package ia.quizapp.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ia.quizapp.TestKey;

public interface TestKeyRepository extends JpaRepository<TestKey, Long> {
	
	 List<TestKey> findAll();
}
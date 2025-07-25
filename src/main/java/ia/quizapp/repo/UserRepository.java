package ia.quizapp.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ia.quizapp.modal.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmail(String email); // Check if email already exists
}

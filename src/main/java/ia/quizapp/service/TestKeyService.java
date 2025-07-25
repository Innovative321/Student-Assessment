package ia.quizapp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ia.quizapp.TestKey;
import ia.quizapp.repo.TestKeyRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TestKeyService {

    @Autowired
    private TestKeyRepository testKeyRepository;

    public List<String> getAllTestKeys() {
        return testKeyRepository.findAll()
                .stream()
                .map(TestKey::getKeyValue)
                .collect(Collectors.toList());
    }
}


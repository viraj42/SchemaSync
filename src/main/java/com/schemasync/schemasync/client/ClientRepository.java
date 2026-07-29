package com.schemasync.schemasync.client;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client,UUID> {
    Optional<Client> findByApiKey(String apiKey);
}

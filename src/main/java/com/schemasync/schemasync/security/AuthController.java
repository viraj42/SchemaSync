package com.schemasync.schemasync.security;

import com.schemasync.schemasync.client.Client;
import com.schemasync.schemasync.client.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final ClientRepository clientRepository;
    private final JwtService jwtService;

    @Value("${jwt.expiration}")
    private long expirationMillis;

    @PostMapping("/token")
    public TokenResponse issueToken(@RequestBody TokenRequest request) {
        Client client = clientRepository.findByApiKey(request.apiKey())
                .orElseThrow(() -> new IllegalArgumentException("Invalid API key"));

        String token = jwtService.generateToken(client.getId());
        return new TokenResponse(token, expirationMillis);
    }
}
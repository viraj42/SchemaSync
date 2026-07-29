package com.schemasync.schemasync.security;

public record TokenResponse(String token, long expiresInMillis) {
}
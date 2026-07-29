package com.schemasync.schemasync.security;

import java.util.UUID;

public record AuthenticatedClient(UUID clientId) {
}
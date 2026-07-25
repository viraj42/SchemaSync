package com.schemasync.schemasync.mapping;

import java.util.List;

public record MappedBatchResult(
        List<MappedRowResult> results
) {
}
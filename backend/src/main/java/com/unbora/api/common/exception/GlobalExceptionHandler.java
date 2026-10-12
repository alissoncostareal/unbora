package com.unbora.api.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex) {
        log.warn("[ApiException] Status {}: {}", ex.getStatus(), ex.getMessage());
        Map<String, Object> body = new HashMap<>();
        body.put("statusCode", ex.getStatus().value());
        body.put("message", ex.getMessage());
        body.put("error", ex.getStatus().getReasonPhrase());
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        Map<String, Object> body = new HashMap<>();
        body.put("statusCode", HttpStatus.BAD_REQUEST.value());
        body.put("message", message.isBlank() ? "Dados inválidos" : message);
        body.put("error", "Bad Request");
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler({CompletionException.class, ExecutionException.class})
    public ResponseEntity<Map<String, Object>> handleAsyncException(Exception ex) {
        Throwable root = ex;
        while ((root instanceof CompletionException || root instanceof ExecutionException) && root.getCause() != null) {
            root = root.getCause();
        }
        if (root instanceof ApiException apiEx) {
            return handleApiException(apiEx);
        }
        if (root instanceof MethodArgumentNotValidException valEx) {
            return handleValidationException(valEx);
        }
        if (root instanceof Exception rootEx) {
            return handleGenericException(rootEx);
        }
        return handleGenericException(ex);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Throwable root = ex;
        while ((root instanceof CompletionException || root instanceof ExecutionException) && root.getCause() != null) {
            root = root.getCause();
        }
        if (root instanceof ApiException apiEx) {
            return handleApiException(apiEx);
        }
        if (root instanceof MethodArgumentNotValidException valEx) {
            return handleValidationException(valEx);
        }

        log.error("[GlobalExceptionHandler] Erro inesperado capturado: {}", root.getMessage(), root);

        Map<String, Object> body = new HashMap<>();
        body.put("statusCode", HttpStatus.INTERNAL_SERVER_ERROR.value());
        String msg = (root.getMessage() != null && !root.getMessage().isBlank() && !root.getMessage().contains("NullPointerException"))
                ? root.getMessage()
                : "Erro interno do servidor ao processar a requisição";
        body.put("message", msg);
        body.put("error", "Internal Server Error");
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}


package com.employeemanagement.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " nicht gefunden mit ID: " + id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}

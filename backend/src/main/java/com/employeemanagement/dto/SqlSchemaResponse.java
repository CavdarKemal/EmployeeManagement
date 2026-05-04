package com.employeemanagement.dto;

import java.util.List;

public record SqlSchemaResponse(List<TableInfo> tables) {

    public record TableInfo(String name, List<ColumnInfo> columns) {}

    public record ColumnInfo(String name, String type, boolean nullable) {}
}

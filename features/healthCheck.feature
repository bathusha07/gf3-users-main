Feature: Health check

  Scenario: Application is up
    When we request the api-docs endpoint
    Then the application returns the open-api definition

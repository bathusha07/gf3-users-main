Feature: Create User

  Scenario: Create a user
    Given valid user data
    When we make a request to create a user
    Then a user should be created

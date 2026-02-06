@journey @internal @contributor
Feature: App Bootstrap
  As a contributor, I need the portagent app to start correctly,
  so that I can begin developing features.

  Background:
    Given the portagent app is configured

  Scenario: Dev server starts successfully
    When I start the portagent dev server
    Then the server should be running on port 5173

  Scenario: Homepage renders
    Given the portagent dev server is running
    When I visit the homepage
    Then I should see "AgentX" in the page title
    And I should see a welcome message

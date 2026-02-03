@agentx @image
Feature: Image API
  As a developer
  I want to manage images via AgentX client
  So that I can create templates for my agents

  Background:
    Given I have an AgentX client connected to the test server
    And I have created container "image-test-container"

  Scenario: Create a basic image
    When I create image in container "image-test-container" with:
      | name         | Test Assistant |
      | systemPrompt | You are helpful |
    Then the response should be successful
    And the image record should have name "Test Assistant"
    And I save the imageId as "basicImage"

  Scenario: Create image with minimal options
    When I create image in container "image-test-container"
    Then the response should be successful
    And I save the imageId as "minimalImage"

  Scenario: Get existing image
    Given I have created an image in container "image-test-container"
    And I save the imageId as "testImage"
    When I get image "{testImage}"
    Then the response should be successful
    And the image record should exist

  Scenario: Get non-existing image
    When I get image "non-existing-image-id"
    Then the image record should not exist

  Scenario: List images in container
    Given I have created an image in container "image-test-container"
    And I save the imageId as "listImage1"
    And I have created an image in container "image-test-container"
    And I save the imageId as "listImage2"
    When I list images in container "image-test-container"
    Then the response should be successful
    And the image list should include "{listImage1}"
    And the image list should include "{listImage2}"

  Scenario: Delete image
    Given I have created an image in container "image-test-container"
    And I save the imageId as "deleteImage"
    When I delete image "{deleteImage}"
    Then the response should be successful
    When I get image "{deleteImage}"
    Then the image record should not exist

/**
 * Image Endpoints - HTTP API contracts for Image operations
 *
 * Image is a static artifact (like Docker Image), managed via HTTP CRUD.
 */

import type { Endpoint } from "./Endpoint";
import type { AgentImage, MetaImage } from "~/application/spec/image";

// ============================================================================
// Response Types
// ============================================================================

export interface ListImagesResponse {
  images: AgentImage[];
}

export interface ListMetaImagesResponse {
  images: MetaImage[];
}

// ============================================================================
// Endpoints
// ============================================================================

/**
 * List all Images
 * GET /images
 */
export interface ListImagesEndpoint extends Endpoint<"GET", "/images", void, ListImagesResponse> {}

/**
 * List Meta Images (one per Definition)
 * GET /images/meta
 */
export interface ListMetaImagesEndpoint
  extends Endpoint<"GET", "/images/meta", void, ListMetaImagesResponse> {}

/**
 * Get single Image
 * GET /images/:imageId
 */
export interface GetImageEndpoint
  extends Endpoint<"GET", "/images/:imageId", { imageId: string }, AgentImage> {}

/**
 * Get Meta Image by Definition name
 * GET /images/meta/:name
 */
export interface GetMetaImageEndpoint
  extends Endpoint<"GET", "/images/meta/:name", { name: string }, MetaImage> {}

/**
 * Delete Image
 * DELETE /images/:imageId
 */
export interface DeleteImageEndpoint
  extends Endpoint<"DELETE", "/images/:imageId", { imageId: string }, void> {}

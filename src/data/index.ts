import resourcesData from './resources.json';
import type { NormalizedResource } from '../types/resource';
import { withBase } from '../lib/base-path';

// Screenshot paths in the JSON are root-relative; the app is served under a base path.
export const resources: NormalizedResource[] = (resourcesData as NormalizedResource[]).map((resource) => ({
  ...resource,
  screenshot: resource.screenshot && withBase(resource.screenshot),
  thumbnail: resource.thumbnail && withBase(resource.thumbnail),
}));

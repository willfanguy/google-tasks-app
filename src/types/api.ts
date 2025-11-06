/**
 * Google Tasks API response types
 */

export interface GoogleTasksListResponse {
  kind: 'tasks#taskLists';
  etag: string;
  items: GoogleTaskList[];
}

export interface GoogleTaskList {
  kind: 'tasks#taskList';
  id: string;
  etag: string;
  title: string;
  updated: string; // RFC 3339
  selfLink: string;
}

export interface GoogleTasksResponse {
  kind: 'tasks#tasks';
  etag: string;
  nextPageToken?: string;
  items: GoogleTask[];
}

export interface GoogleTask {
  kind: 'tasks#task';
  id: string;
  etag: string;
  title: string;
  updated: string; // RFC 3339
  selfLink: string;
  parent?: string;
  position: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string; // RFC 3339
  completed?: string; // RFC 3339
  deleted?: boolean;
  hidden?: boolean;
  links?: Array<{
    type: string;
    description: string;
    link: string;
  }>;
}

export interface GoogleAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

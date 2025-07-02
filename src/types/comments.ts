export interface CommentUser {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  createdBy: CommentUser;
}

export interface ApiComment {
  _id: string;
  content: string;
  createdAt: string;
  createdBy: {
    _id?: string;
    id?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

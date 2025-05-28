import { DataSource } from 'typeorm';
import * as Hapi from '@hapi/hapi';

declare module '@hapi/hapi' {
  export interface AuthCredentials {
    id: number;
    role: string;
  }

  export interface Request {
    auth: {
      credentials: AuthCredentials;
    };
  }
  interface ServerApplicationState {
    dataSource: DataSource; 
  }
}

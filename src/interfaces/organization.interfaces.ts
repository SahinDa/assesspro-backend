import { AuthProvider, UserRole, UserStatus } from "src/config/enum";

export class IOrganization {
  // Core user profile metrics
  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  oauth_provider?: AuthProvider;
  oauth_id?: string;
  email_verified: boolean;
  role: UserRole;
  status: UserStatus;
  profile_pic?: string;
  created_at: Date;
  updated_at?: Date;

  // Organization metrics
  org_id: string; 
  org_name: string;
  org_status: number; 
}
import { User } from '@interfaces/users.interface'

export interface DataStoredInToken {
  id: number
}

export interface TokenData {
  token: string
  expiresIn: number
}

export interface RequestWithUser {
  user: User
}

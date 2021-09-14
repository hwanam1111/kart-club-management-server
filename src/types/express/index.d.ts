declare namespace Express {
  interface User {
    id?: number,
    kartRiderAccessId?: string,
    email?: string,
    clubId?: number,
    profileImageUri?: string,
    rating?: string,
    isWithdrawal?: number
  }
}

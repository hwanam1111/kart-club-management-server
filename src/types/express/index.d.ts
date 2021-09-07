declare namespace Express {
  interface User {
    id?: number,
    kartRiderAccessId?: string,
    email?: string,
    clubId?: number,
    nickname?: string,
    profileImageUri?: string,
    rating?: string,
    isWithdrawal?: number
  }
}

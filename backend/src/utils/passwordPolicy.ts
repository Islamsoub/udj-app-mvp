/**
 * Student password length bounds. Login accepts up to PASSWORD_MAX, so any
 * password a student can set through PATCH /student/password can be used to
 * sign in.
 *
 * bcrypt only reads the first 72 bytes of its input, so two passwords that
 * share their first 72 bytes hash alike. 128 is the product's limit; the
 * effective strength is that of the first 72 bytes.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

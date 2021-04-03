export const validateLoginUser = ({
  email,
  password
}: {
  email: string;
  password: string;
}) => {
  const emailPattern = new RegExp(
    /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i
  );

  let isValid = true;
  let errorMessage = "";

  if (email.trim().length === 0) {
    isValid = false;
    errorMessage = "email isn't provided";
  }

  if (!emailPattern.test(email)) {
    isValid = false;
    errorMessage = "email isn't valid";
  }

  if (password.trim().length <= 5) {
    isValid = false;
    errorMessage = "password is to short, must be at least 5 characters long";
  }

  return { isValid, errorMessage };
};

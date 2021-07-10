// nameOf operator
// https://schneidenbach.gitbooks.io/typescript-cookbook/content/nameof-operator.html
export function nameOf<T>(name: keyof T) {
  return name;
}

export function getNameOf<T>() {
  return (name: keyof T) => name;
}

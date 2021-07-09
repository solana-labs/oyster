export const formVerticalLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

/* eslint-disable no-template-curly-in-string */
export const formValidateMessages = {
  required: 'Please provide ${label}',
};
/* eslint-enable no-template-curly-in-string */

export const formDefaults = {
  requiredMark: false,
  ...formVerticalLayout,
  validateMessages: formValidateMessages,
};

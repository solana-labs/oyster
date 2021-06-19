export const formVerticalLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

/* eslint-disable no-template-curly-in-string */
export const formValidateMessages = {
  required: 'Please provide a ${label}',
};
/* eslint-enable no-template-curly-in-string */

export const formDefaults = {
  requiredMark: false,
  ...formVerticalLayout,
  validateMessages: formValidateMessages,
};

export const formSlotInputStyle = {
  width: 250,
};

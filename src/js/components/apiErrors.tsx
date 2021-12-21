import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';
import { t } from 'i18next';
import * as React from 'react';

import { removeError } from '@/js/store/errors/actions';
import { ErrorType } from '@/js/store/errors/reducer';

const reloadPage = (): void => {
  window.location.reload();
};

const ErrorToast = ({
  error,
  doRemoveError,
}: {
  error: ErrorType;
  doRemoveError: typeof removeError;
}) => (
  <Toast
    labels={{
      heading: t("Uh oh, we've encountered an error. You may need to "),
      headingLink: t('reload the page.'),
      details: error.message,
    }}
    variant="error"
    onClickHeadingLink={reloadPage}
    onRequestClose={() => doRemoveError(error.id)}
  />
);

const Errors = ({
  errors,
  doRemoveError,
}: {
  errors: ErrorType[];
  doRemoveError: typeof removeError;
}) => (
  <ToastContainer className="half-container">
    {errors?.map((err) => (
      <ErrorToast key={err.id} error={err} doRemoveError={doRemoveError} />
    ))}
  </ToastContainer>
);

export default Errors;

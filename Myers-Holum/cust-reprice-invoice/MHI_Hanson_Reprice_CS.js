/* eslint-disable max-len */
/* eslint-disable camelcase */
/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([
  'N/currentRecord',
  'N/url',
  'N/record',
  'N/ui/message',
  'N/search',
  'N/https'
], (
  currentRecord,
  url,
  record,
  message,
  search,
  https
) => {
  function pageInit(context) {
    console.log('pageInit::context', context);
    // const { currentRecord } = context;
    // const lines = currentRecord.getLineCount({
    //   sublistId: 'item'
    // });
    // for (let i = 0; i < lines; i += 1) {
    //   const costType =
    // }
  }

  function reprice(id, type) {
    console.log('approve');
    console.log('approve::id', id);
    console.log('approve::type', type);
    handleUpdate(id, type, 'reprice');
  }

  function handleUpdate(id, type, buttonType) {
    const transactionSearchObj = search.create({
      type: 'transaction',
      filters:
      [
        ['type', 'anyof', 'Estimate', 'SalesOrd'],
        'AND',
        ['internalid', 'anyof', id],
        'AND',
        ['costestimatetype', 'anyof', 'CUSTOM'],
        'AND',
        ['costestimate', 'equalto', '0.00']
      ],
      columns:
      [
        'item'
      ]
    });
    const searchResultCount = transactionSearchObj.runPaged().count;
    log.debug('transactionSearchObj result count', searchResultCount);

    if (searchResultCount > 0) {
      postMissingSuitelet(id, type, buttonType);
      return;
    }

    postSuitelet(id, type, buttonType);
  }

  function postMissingSuitelet(id, type, buttonType) {
    const suiteletURL = url.resolveScript({
      scriptId: 'customscript_mhi_hanson_reprice_sl',
      deploymentId: 'customdeploy_mhi_hanson_reprice_sl',
      params: {
        recordId: id,
        type,
        buttonType
      }
    });
    console.log('suiteletURL', suiteletURL);

    const pMessage = processingMissingMessage();

    https.post.promise({ url: suiteletURL }).then((response) => {
      console.log(response.body);
      log.audit('body response', response.body);
      pMessage.hide();
      confirmationMessage();
      refresh(type, id);
    }).catch((reason) => {
      console.log(reason);
      pMessage.hide();
      errorMessage(reason);
    });
  }

  function postSuitelet(id, type, buttonType) {
    const suiteletURL = url.resolveScript({
      scriptId: 'customscript_mhi_hanson_reprice_sl',
      deploymentId: 'customdeploy_mhi_hanson_reprice_sl',
      params: {
        recordId: id,
        type,
        buttonType
      }
    });
    console.log('suiteletURL', suiteletURL);

    const pMessage = processingMessage();

    https.post.promise({ url: suiteletURL }).then((response) => {
      console.log(response.body);
      log.audit('body response', response.body);
      pMessage.hide();
      confirmationMessage();
      refresh(type, id);
    }).catch((reason) => {
      console.log(reason);
      pMessage.hide();
      errorMessage(reason);
    });
  }

  function errorMessage(responseError) {
    console.log('name', responseError.name);
    console.log('message', responseError.message);
    const eMessage = message.create({
      title: responseError.name,
      message: responseError.message,
      type: message.Type.ERROR
    });
    eMessage.show();
  }

  function refresh(type, id) {
    const output = url.resolveRecord({
      recordType: type,
      recordId: id,
      isEditMode: false
    });
    window.onbeforeunload = null;
    window.open(output, '_self');
  }

  function processingMessage() {
    const processMessage = message.create({
      title: 'Processing...',
      message: 'Page will refresh once processing is complete.',
      type: message.Type.INFORMATION
    });
    processMessage.show();
    return processMessage;
  }

  function processingMissingMessage() {
    const processMessage = message.create({
      title: 'Missing Values...',
      message: 'Please populate the Extended Cost for item(s). Page will refresh once Cost Estimate Type change to Custom is complete.',
      type: message.Type.INFORMATION
    });
    processMessage.show();
    return processMessage;
  }

  function confirmationMessage() {
    const processMessage = message.create({
      title: 'Confirmation',
      message: 'Please wait a few seconds for the page to refresh.',
      type: message.Type.CONFIRMATION
    });
    processMessage.show();
  }

  return {
    pageInit,
    reprice
  };
});

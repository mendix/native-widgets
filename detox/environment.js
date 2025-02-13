/* eslint-disable prettier/prettier */
const { DetoxCircusEnvironment } = require('detox/runners/jest');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(config, context) {
    super(config, context);

    // leave your custom code
  }
}

module.exports = CustomDetoxEnvironment;
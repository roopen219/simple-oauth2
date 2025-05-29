import BaseChance from "chance";
import accessTokenMixin from "chance-access-token";

class Chance extends BaseChance {
  constructor(...args) {
    super(...args);

    this.mixin({ accessToken: accessTokenMixin });
  }
}

export default Chance;

const EMAIL_REGEX = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿŠŽšžŸÇçßÐņĀāēūīō ]+[A-Za-zÀ-ÖØ-öø-ÿŠŽšžŸÇçßÐņĀāēūīō ]*$/; // /^[a-zA-Z '.-]*$/;
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,15}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=(?:.*\d){2,})(?=.*[@$!%*?&.,:;/\\(){}\[\]_\-+<>'!\\|=^#¬®,™,¡,°,¶,§,×,€,¥,¢,÷,¬,¦,©áéíñóúü¿])[ +<>'!¬®,™,¡,°,¶,§,×,€,¥,£,",¢,÷,¬,¦,©áéíñóúü¿\\|=^#-~]/;
const COLOMBIAN_PHONE_NUMBER_REGEX = /^\+57[0-9]{10}$/;
const PASS_CODE_REGEX = /^\d{4}$/;
const AMOUNT_REGEX = !/^[0-9]+([,.][0-9]+)?$/;
const DATE_OF_BIRTH_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY_CODE_REGEX = /^[A-Za-z]+$/;
const CITY_REGION_REGEX = /^[A-Za-z\s]+$/;
const ZIPCODE_REGEX = /^[0-9]+$/;
const NUMBER_REGEX = /^\+[0-9]+$/;
const CASHOUT_GENERIC_BANK_VALIDATION_REGEX = /^\d{8,19}$/;
const CASHOUT_WALLET_REGEX = /^[\s\S]{1,20}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export {
    EMAIL_REGEX,
    NAME_REGEX,
    DATE_REGEX,
    USERNAME_REGEX,
    PASSWORD_REGEX,
    COLOMBIAN_PHONE_NUMBER_REGEX,
    PASS_CODE_REGEX,
    AMOUNT_REGEX,
    DATE_OF_BIRTH_REGEX,
    COUNTRY_CODE_REGEX,
    CITY_REGION_REGEX,
    ZIPCODE_REGEX,
    NUMBER_REGEX,
    CASHOUT_GENERIC_BANK_VALIDATION_REGEX,
    CASHOUT_WALLET_REGEX,
};

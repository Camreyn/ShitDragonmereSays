const phonePattern = /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b/g;
const addressPattern = /\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct)\b/gi;
const nameHintPattern = /\b(?:mr|mrs|ms|miss|sir)\.?\s+[A-Z][a-z]+\b/g;

export function redactSensitiveText(text: string) {
  return text
    .replace(phonePattern, "[redacted phone]")
    .replace(addressPattern, "[redacted address]")
    .replace(nameHintPattern, "[redacted name]");
}

export function hasSensitiveMarkers(text: string) {
  const clonedPhone = new RegExp(phonePattern.source, phonePattern.flags);
  const clonedAddress = new RegExp(addressPattern.source, addressPattern.flags);
  const clonedName = new RegExp(nameHintPattern.source, nameHintPattern.flags);
  return clonedPhone.test(text) || clonedAddress.test(text) || clonedName.test(text);
}

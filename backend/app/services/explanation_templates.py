from dataclasses import dataclass


@dataclass(frozen=True)
class ExplanationTemplate:
    explanation: str
    impact: str
    fix_suggestion: str


TEMPLATES: dict[str, ExplanationTemplate] = {
    "Broken Images": ExplanationTemplate(
        "One or more image assets failed to load from their configured URLs.",
        "Broken visuals reduce trust and can hide important page content.",
        "Verify each failing image URL, deploy missing assets, and provide an appropriate fallback.",
    ),
    "Missing Alt Text": ExplanationTemplate(
        "One or more images do not expose a useful text alternative.",
        "Screen-reader users may be unable to understand the image content.",
        "Add concise alt text to informative images and use an empty alt attribute only for decorative images.",
    ),
    "Required Field Validation": ExplanationTemplate(
        "The form does not expose required-field constraints in its markup.",
        "Users may submit incomplete information or receive unclear validation feedback.",
        "Confirm which fields are required and enforce the rules on both the client and server.",
    ),
    "Email Validation Check": ExplanationTemplate(
        "The detected email field does not expose an email type or validation pattern.",
        "Malformed email addresses may enter downstream workflows.",
        "Use an email input type and always validate the submitted value on the server.",
    ),
    "Password Validation Check": ExplanationTemplate(
        "The password field does not expose a minimum length or validation pattern.",
        "Users may choose passwords that do not meet the intended account-security policy.",
        "Enforce the password policy on the server and communicate its requirements clearly in the form.",
    ),
    "Missing Form Labels": ExplanationTemplate(
        "One or more form controls do not have an accessible label.",
        "Users of assistive technology may not understand what information a field expects.",
        "Associate each control with a label or provide an appropriate aria-label or aria-labelledby value.",
    ),
    "Insecure Form Submission": ExplanationTemplate(
        "The form action resolves to an insecure HTTP endpoint.",
        "Submitted information could be exposed or modified in transit.",
        "Submit the form only over HTTPS and redirect all insecure endpoints to their secure equivalents.",
    ),
    "Missing Page Title": ExplanationTemplate(
        "The page has no meaningful document title.",
        "Browser tabs, assistive technology, and search results cannot identify the page clearly.",
        "Add a concise, unique title that describes the page purpose.",
    ),
    "Duplicate Page Title": ExplanationTemplate(
        "Multiple pages share the same document title.",
        "Users and search engines may have difficulty distinguishing those pages.",
        "Give each page a concise title that describes its unique purpose.",
    ),
    "Missing Meta Description": ExplanationTemplate(
        "The page does not provide a meta description.",
        "Search engines may generate a less useful result snippet for the page.",
        "Add a concise description that accurately summarizes the page content.",
    ),
    "Empty Buttons": ExplanationTemplate(
        "One or more buttons do not expose an accessible name.",
        "Users may not be able to determine what action the button performs.",
        "Add visible text or an appropriate accessible name to every interactive button.",
    ),
    "Empty Links": ExplanationTemplate(
        "One or more links do not expose meaningful text or an accessible name.",
        "Keyboard and screen-reader users may not know where the link leads.",
        "Add descriptive link text or an appropriate accessible name.",
    ),
}


DEFAULT_TEMPLATE = ExplanationTemplate(
    "The scanner detected behavior that may affect this page.",
    "Users may experience reduced usability, accessibility, or reliability.",
    "Review the collected evidence and apply a targeted fix to the affected component.",
)


def get_explanation_template(issue_type: str) -> ExplanationTemplate:
    return TEMPLATES.get(issue_type, DEFAULT_TEMPLATE)


def has_explanation_template(issue_type: str) -> bool:
    return issue_type in TEMPLATES

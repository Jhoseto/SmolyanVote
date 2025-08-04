package smolyanVote.smolyanVote.aspects;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * AOP Aspect за автоматично логване на потребителски активности
 * Обработва @LogActivity анотации и записва активностите в базата данни
 */
@Aspect
@Component
public class ActivityLoggingAspect {

    private final ActivityLogService activityLogService;
    private final UserService userService;

    @Autowired
    public ActivityLoggingAspect(ActivityLogService activityLogService, UserService userService) {
        this.activityLogService = activityLogService;
        this.userService = userService;
    }

    /**
     * Around advice за методи анотирани с @LogActivity
     */
    @Around("@annotation(logActivity)")
    public Object logActivityExecution(ProceedingJoinPoint joinPoint, LogActivity logActivity) throws Throwable {
        Object result = null;
        Exception thrownException = null;

        try {
            // Изпълняваме оригиналния метод
            result = joinPoint.proceed();
            return result;

        } catch (Exception e) {
            thrownException = e;
            throw e;

        } finally {
            // Записваме активността
            try {
                // Проверяваме дали да записваме при грешка
                if (thrownException != null && logActivity.onSuccessOnly()) {
                    return result; // Не записваме при неуспех
                }

                recordActivity(joinPoint, logActivity, result, thrownException);

            } catch (Exception loggingException) {
                System.err.println("❌ Error in activity logging aspect: " + loggingException.getMessage());
                // Не хвърляме грешка от logging-а, за да не съсипем основната функционалност
            }
        }
    }

    /**
     * Записва активността в базата данни
     */
    private void recordActivity(ProceedingJoinPoint joinPoint, LogActivity logActivity,
                                Object result, Exception exception) {

        try {
            // Извличаме информация за потребителя
            UserEntity currentUser = getCurrentUser();

            // Определяме action-а - приоритет на enum над string
            ActivityActionEnum actionEnum;
            String actionString;

            if (!logActivity.actionString().isEmpty()) {
                // Legacy support за String actions
                actionString = logActivity.actionString();
                actionEnum = ActivityActionEnum.fromString(actionString);
                if (currentUser == null && !isGuestAllowed(actionString)) {
                    return; // Не логваме guest действия които не са разрешени
                }
            } else {
                // Използваме enum action
                actionEnum = logActivity.action();
                actionString = actionEnum.getActionName();
                if (currentUser == null && !isGuestAllowed(actionString)) {
                    return; // Не логваме guest действия които не са разрешени
                }
            }

            // Извличаме HTTP информация
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = extractIpAddress(request);
            String userAgent = extractUserAgent(request);

            // Извличаме entity информация - ПОПРАВЕНО
            String entityType = extractEntityType(logActivity);
            Long entityId = extractEntityId(joinPoint, logActivity, result);

            // Генерираме детайли - ПОДОБРЕНО
            String details = generateDetails(joinPoint, logActivity, result, exception);

            // Записваме активността
            if (actionEnum != null) {
                activityLogService.logActivity(actionEnum, currentUser, entityType, entityId,
                        details, ipAddress, userAgent);
            } else {
                // Fallback за неразпознати действия
                activityLogService.logActivity(actionString, currentUser, entityType, entityId,
                        details, ipAddress, userAgent);
            }

        } catch (Exception e) {
            System.err.println("Error in activity logging aspect: " + e.getMessage());
        }
    }

    /**
     * Извлича entity type от анотацията - ПОПРАВЕНО
     */
    private String extractEntityType(LogActivity logActivity) {
        EventType eventType = logActivity.entityType();
        if (eventType == null || eventType == EventType.DEFAULT) {
            return null;
        }
        return eventType.name(); // PUBLICATION, SIMPLEEVENT, etc.
    }

    /**
     * Извлича entity ID от параметрите на метода или резултата - ПОДОБРЕНО
     */
    private Long extractEntityId(ProceedingJoinPoint joinPoint, LogActivity logActivity, Object result) {

        // 1. Ако е зададено статично ID
        if (logActivity.entityId() != -1) {
            return logActivity.entityId();
        }

        // 2. Ако е зададен конкретен параметър
        if (!logActivity.entityIdParam().isEmpty()) {
            Long paramValue = findParameterValue(joinPoint, logActivity.entityIdParam());
            if (paramValue != null) {
                return paramValue;
            }
        }

        // 3. Автоматично търсене на ID параметри
        String[] commonIdNames = {"id", "entityId"};

        // 4. Добавяме специфични имена според entity type
        EventType entityType = logActivity.entityType();
        if (entityType != null && entityType != EventType.DEFAULT) {
            String[] specificNames = generateEntitySpecificIdNames(entityType);
            commonIdNames = combineArrays(commonIdNames, specificNames);
        }

        // 5. Търсим в параметрите
        for (String idName : commonIdNames) {
            Long foundId = findParameterValue(joinPoint, idName);
            if (foundId != null) {
                return foundId;
            }
        }

        // 6. Търсим в резултата ако е entity с getId() метод
        if (result != null) {
            Long resultId = extractIdFromResult(result);
            if (resultId != null) {
                return resultId;
            }
        }

        return null;
    }

    /**
     * Генерира възможни имена на ID параметри според entity type
     */
    private String[] generateEntitySpecificIdNames(EventType entityType) {
        return switch (entityType) {
            case PUBLICATION -> new String[]{"publicationId", "pubId"};
            case SIMPLEEVENT -> new String[]{"simpleEventId", "eventId"};
            case REFERENDUM -> new String[]{"referendumId", "refId"};
            case MULTI_POLL -> new String[]{"multiPollId", "pollId"};
            case SIGNAL -> new String[]{"signalId"};
            default -> new String[]{};
        };
    }

    /**
     * Комбинира два string array-а
     */
    private String[] combineArrays(String[] array1, String[] array2) {
        String[] result = Arrays.copyOf(array1, array1.length + array2.length);
        System.arraycopy(array2, 0, result, array1.length, array2.length);
        return result;
    }

    /**
     * Извлича ID от резултата на метода
     */
    private Long extractIdFromResult(Object result) {
        try {
            // Опитваме getId() метод
            Method getIdMethod = result.getClass().getMethod("getId");
            Object idResult = getIdMethod.invoke(result);

            if (idResult instanceof Long) {
                return (Long) idResult;
            } else if (idResult instanceof Number) {
                return ((Number) idResult).longValue();
            }
        } catch (Exception e) {
            // Ignore, не всички класове имат getId()
        }
        return null;
    }

    /**
     * Търси стойност на параметър по име - ПОДОБРЕНО
     */
    private Long findParameterValue(ProceedingJoinPoint joinPoint, String parameterName) {
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Parameter[] parameters = method.getParameters();
            Object[] args = joinPoint.getArgs();

            for (int i = 0; i < parameters.length; i++) {
                String paramName = parameters[i].getName();

                // Exact match или case-insensitive match
                if (paramName.equals(parameterName) ||
                        paramName.equalsIgnoreCase(parameterName)) {

                    Object value = args[i];
                    return convertToLong(value);
                }
            }
        } catch (Exception e) {
            System.err.println("Error finding parameter value: " + e.getMessage());
        }
        return null;
    }

    /**
     * Конвертира обект към Long
     */
    private Long convertToLong(Object value) {
        if (value == null) return null;

        if (value instanceof Long) {
            return (Long) value;
        } else if (value instanceof Number) {
            return ((Number) value).longValue();
        } else if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Генерира детайли за активността - ПОДОБРЕНО
     */
    private String generateDetails(ProceedingJoinPoint joinPoint, LogActivity logActivity,
                                   Object result, Exception exception) {

        StringBuilder details = new StringBuilder();

        // 1. Ако има custom details template
        if (!logActivity.details().isEmpty()) {
            String processedDetails = replacePlaceholders(logActivity.details(), joinPoint, result);
            details.append(processedDetails);
        }

        // 2. Добавяме автоматични детайли ако няма custom
        if (details.length() == 0) {
            String autoDetails = generateAutoDetails(joinPoint, logActivity, result);
            details.append(autoDetails);
        }

        // 3. Добавяме информация за грешка ако има
        if (exception != null) {
            if (details.length() > 0) {
                details.append(" | ");
            }
            details.append("Error: ").append(exception.getClass().getSimpleName());
            if (exception.getMessage() != null) {
                details.append(" - ").append(exception.getMessage());
            }
        }

        // 4. Ограничаваме дължината
        String finalDetails = details.toString();
        if (finalDetails.length() > 500) {
            finalDetails = finalDetails.substring(0, 497) + "...";
        }

        return finalDetails;
    }

    /**
     * Генерира автоматични детайли според action type
     */
    private String generateAutoDetails(ProceedingJoinPoint joinPoint, LogActivity logActivity, Object result) {
        ActivityActionEnum action = logActivity.action();

        // За създаване - извличаме заглавие/тема
        if (action.getCategory().equals("create")) {
            String title = extractTitleFromParameters(joinPoint);
            if (title != null) {
                return "Title: " + title;
            }
        }

        // За коментари - извличаме текста
        if (action == ActivityActionEnum.CREATE_COMMENT) {
            String text = extractTextFromParameters(joinPoint);
            if (text != null) {
                return "Text: " + (text.length() > 100 ? text.substring(0, 100) + "..." : text);
            }
        }

        // За voting - извличаме избора
        if (action.getCategory().equals("interact") && action.name().contains("VOTE")) {
            String choice = extractVoteChoiceFromParameters(joinPoint);
            if (choice != null) {
                return "Choice: " + choice;
            }
        }

        // Fallback
        return "Method: " + joinPoint.getSignature().getName();
    }

    /**
     * Извлича заглавие от параметрите
     */
    private String extractTitleFromParameters(ProceedingJoinPoint joinPoint) {
        String[] titleParams = {"title", "topic", "name", "subject"};
        return extractStringParameter(joinPoint, titleParams);
    }

    /**
     * Извлича текст от параметрите
     */
    private String extractTextFromParameters(ProceedingJoinPoint joinPoint) {
        String[] textParams = {"text", "content", "message", "description"};
        return extractStringParameter(joinPoint, textParams);
    }

    /**
     * Извлича vote choice от параметрите
     */
    private String extractVoteChoiceFromParameters(ProceedingJoinPoint joinPoint) {
        String[] choiceParams = {"choice", "option", "voteChoice", "selectedOption"};
        return extractStringParameter(joinPoint, choiceParams);
    }

    /**
     * Извлича string параметър по възможни имена
     */
    private String extractStringParameter(ProceedingJoinPoint joinPoint, String[] paramNames) {
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Parameter[] parameters = method.getParameters();
            Object[] args = joinPoint.getArgs();

            for (String paramName : paramNames) {
                for (int i = 0; i < parameters.length; i++) {
                    if (parameters[i].getName().equalsIgnoreCase(paramName)) {
                        Object value = args[i];
                        if (value instanceof String) {
                            return (String) value;
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return null;
    }

    /**
     * Замества placeholder-и в details template - ПОДОБРЕНО
     */
    private String replacePlaceholders(String template, ProceedingJoinPoint joinPoint, Object result) {
        String processed = template;

        try {
            // Pattern за намиране на {parameterName} placeholders
            Pattern pattern = Pattern.compile("\\{(\\w+)\\}");
            Matcher matcher = pattern.matcher(template);

            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Parameter[] parameters = method.getParameters();
            Object[] args = joinPoint.getArgs();

            while (matcher.find()) {
                String placeholder = matcher.group(0); // цялата {parameterName}
                String paramName = matcher.group(1);   // само parameterName

                String replacement = placeholder; // fallback

                // Търсим в параметрите
                for (int i = 0; i < parameters.length; i++) {
                    if (parameters[i].getName().equals(paramName)) {
                        Object value = args[i];
                        replacement = formatParameterValue(value);
                        break;
                    }
                }

                // Специални placeholders
                if ("result".equals(paramName) && result != null) {
                    replacement = formatParameterValue(result);
                } else if ("resultId".equals(paramName) && result != null) {
                    Long id = extractIdFromResult(result);
                    replacement = id != null ? id.toString() : "null";
                } else if ("method".equals(paramName)) {
                    replacement = method.getName();
                } else if ("class".equals(paramName)) {
                    replacement = method.getDeclaringClass().getSimpleName();
                }

                processed = processed.replace(placeholder, replacement);
            }

        } catch (Exception e) {
            System.err.println("Error replacing placeholders: " + e.getMessage());
        }

        return processed;
    }

    /**
     * Форматира стойност на параметър за показване
     */
    private String formatParameterValue(Object value) {
        if (value == null) return "null";

        String str = value.toString();
        // Ограничаваме дължината за дълги текстове
        if (str.length() > 200) {
            return str.substring(0, 197) + "...";
        }
        return str;
    }

    /**
     * Извлича текущия автентифициран потребител
     */
    private UserEntity getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return null;
            }

            return userService.getCurrentUser();

        } catch (Exception e) {
            System.err.println("Error getting current user: " + e.getMessage());
            return null;
        }
    }

    /**
     * Извлича текущия HTTP request
     */
    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            return attrs.getRequest();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Извлича IP адрес от HTTP request
     */
    private String extractIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }

        try {
            // Проверяваме за proxy headers
            String[] headerNames = {
                    "X-Forwarded-For",
                    "X-Real-IP",
                    "Proxy-Client-IP",
                    "WL-Proxy-Client-IP",
                    "HTTP_X_FORWARDED_FOR",
                    "HTTP_X_FORWARDED",
                    "HTTP_X_CLUSTER_CLIENT_IP",
                    "HTTP_CLIENT_IP",
                    "HTTP_FORWARDED_FOR",
                    "HTTP_FORWARDED"
            };

            for (String header : headerNames) {
                String ip = request.getHeader(header);
                if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                    // X-Forwarded-For може да съдържа множество IP-та
                    if (ip.contains(",")) {
                        ip = ip.split(",")[0].trim();
                    }
                    return ip;
                }
            }

            // Fallback към remote address
            return request.getRemoteAddr();

        } catch (Exception e) {
            System.err.println("Error extracting IP address: " + e.getMessage());
            return "unknown";
        }
    }

    /**
     * Извлича User Agent от HTTP request
     */
    private String extractUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        try {
            String userAgent = request.getHeader("User-Agent");

            // Ограничаваме дължината
            if (userAgent != null && userAgent.length() > 500) {
                userAgent = userAgent.substring(0, 497) + "...";
            }

            return userAgent;
        } catch (Exception e) {
            System.err.println("Error extracting User Agent: " + e.getMessage());
            return null;
        }
    }

    /**
     * Проверява дали guest потребителите могат да извършват определено действие
     */
    private boolean isGuestAllowed(String action) {
        if (action == null) {
            return false;
        }

        String actionLower = action.toLowerCase();

        // Действия които гостите могат да правят
        return actionLower.contains("view") ||
                actionLower.contains("search") ||
                actionLower.contains("filter") ||
                actionLower.contains("api_access") ||
                actionLower.contains("visit");
    }

}
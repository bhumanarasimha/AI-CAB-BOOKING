<?php
require_once __DIR__ . '/db.php';

function handleChatsRoute($method, $chatId = null, $subResource = null) {
    global $pdo;
    $input = getJsonInput();
    $user = getAuthUser($pdo);

    if ($method === 'POST' && !$chatId) {
        $targetUserId = isset($input['targetUserId']) ? trim($input['targetUserId']) : 'user_target';
        $id = "chat_" . abs(crc32($user['id'] . $targetUserId));

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO Chats (id, user1Id, user2Id, createdAt) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE id=id");
                $stmt->execute([$id, $user['id'], $targetUserId]);
            } catch (Exception $e) {
            }
        }

        jsonResponse([
            "id" => $id,
            "user1Id" => $user['id'],
            "user2Id" => $targetUserId,
            "createdAt" => date('c')
        ]);
    }

    if ($method === 'GET' && !$chatId) {
        $chats = [];
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM Chats WHERE user1Id = ? OR user2Id = ? ORDER BY createdAt DESC");
                $stmt->execute([$user['id'], $user['id']]);
                $chats = $stmt->fetchAll();
            } catch (Exception $e) {
            }
        }
        jsonResponse($chats);
    }

    if ($method === 'GET' && $chatId && !$subResource) {
        $messages = [];
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM Messages WHERE chatId = ? ORDER BY createdAt ASC");
                $stmt->execute([$chatId]);
                $messages = $stmt->fetchAll();
            } catch (Exception $e) {
            }
        }
        jsonResponse([
            "id" => $chatId,
            "messages" => $messages
        ]);
    }

    if ($method === 'POST' && $chatId && $subResource === 'messages') {
        $text = isset($input['text']) ? trim($input['text']) : '';
        $msgId = "msg_" . time() . "_" . rand(100, 999);

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO Messages (id, chatId, senderId, text, createdAt) VALUES (?, ?, ?, ?, NOW())");
                $stmt->execute([$msgId, $chatId, $user['id'], $text]);
            } catch (Exception $e) {
            }
        }

        jsonResponse([
            "id" => $msgId,
            "chatId" => $chatId,
            "senderId" => $user['id'],
            "text" => $text,
            "createdAt" => date('c')
        ], 201);
    }

    jsonResponse(["msg" => "Chat endpoint not found"], 404);
}
?>

<?php
$dsn = "pgsql:host=db.jkddrenwrriuyesfuzgc;port=5432;dbname=postgres";
$user = "postgres";
$password = "uHCCAGDMD1@";
$supabase_url = "https://jkddrenwrriuyesfuzgc.supabase.co";
$supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZGRyZW53cnJpdXllc2Z1emdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNzQwMzYsImV4cCI6MjA1ODg1MDAzNn0.FsgntJgmM6JIe8oe00q2G0pTKbbpAFyIjmHVA0WkoT8";

try {
    $conn = new PDO($dsn, $user, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $username = $_POST['username'];
    $email = strtolower(trim($_POST['email']));
    $handle = $_POST['handle'];
    if (!str_starts_with($handle, '@')) $handle = '@' . $handle;
    $password_input = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    $bio = $_POST['bio'];
    $birthdate = $_POST['birthdate'];

    // Validações básicas
    if ($password_input !== $confirm_password) {
        echo json_encode(['error' => 'As senhas não coincidem']);
        exit;
    }
    if (strlen($username) > 30 || strlen($handle) > 20 || strlen($bio) > 160) {
        echo json_encode(['error' => 'Campos excedem limite de caracteres']);
        exit;
    }

    $check_stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE email = :email OR handle = :handle");
    $check_stmt->execute(['email' => $email, 'handle' => $handle]);
    if ($check_stmt->fetchColumn() > 0) {
        echo json_encode(['error' => 'Email ou handle já em uso']);
        exit;
    }

    // Upload da foto de perfil
    $profile_pic = $_FILES['profile_pic']['tmp_name'];
    $profile_pic_name = "avatar_" . time() . ".jpg";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabase_url/avatars/$profile_pic_name");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents($profile_pic));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $supabase_key",
        "Content-Type: image/jpeg"
    ]);
    curl_exec($ch);
    curl_close($ch);
    $avatar_url = "$supabase_url/public/avatars/$profile_pic_name";

    // Upload da foto de capa
    $cover_pic = $_FILES['cover_pic']['tmp_name'];
    $cover_pic_name = "cover_" . time() . ".jpg";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabase_url/cover_pics/$cover_pic_name");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents($cover_pic));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $supabase_key",
        "Content-Type: image/jpeg"
    ]);
    curl_exec($ch);
    curl_close($ch);
    $cover_url = "$supabase_url/public/cover_pics/$cover_pic_name";

    // Inserir usuário
    $stmt = $conn->prepare("
        INSERT INTO users (username, email, handle, password, bio, birthdate, avatar, cover_pic)
        VALUES (:username, :email, :handle, :password, :bio, :birthdate, :avatar, :cover_pic)
        RETURNING id
    ");
    $stmt->execute([
        'username' => $username,
        'email' => $email,
        'handle' => $handle,
        'password' => $password_input, // Use password_hash no futuro
        'bio' => $bio,
        'birthdate' => $birthdate,
        'avatar' => $avatar_url,
        'cover_pic' => $cover_url
    ]);

    $user_id = $stmt->fetchColumn();
    $currentUser = [
        'email' => $email,
        'username' => $username,
        'avatar' => $avatar_url,
        'handle' => $handle
    ];
    echo json_encode(['success' => true, 'user' => $currentUser]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erro ao cadastrar: ' . $e->getMessage()]);
}
?>
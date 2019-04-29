<?php
copy ("todo.json", dirname(__FILE__) . '/todo-snaps/' . date("m_d_y h-i-s a", time()) . '.json');
file_put_contents("todo.json", file_get_contents("php://input"));
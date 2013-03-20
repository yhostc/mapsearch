<?php
if (!defined('THINK_PATH')) exit();

$config =	array(
	/*
	'DB_TYPE' => 'PGSQL',
	'DB_HOST'=>'172.17.41.117',
	'DB_NAME'=>'mapabc-ditu',
	'DB_USER'=>'postgres',
	'DB_PWD'=>'mapabc',
	'DB_PORT'=>'5432',
	'DB_PREFIX'=>'',
	*/
	'DB_TYPE' => 'MYSQL',
	'DB_HOST'=>'10.2.134.39',
	'DB_NAME'=>'amap-ditu',
	'DB_USER'=>'amap-ditu',
	'DB_PWD'=>'amap-ditu',
	'DB_PORT'=>'3306',
	'DB_PREFIX'=>'',
	
	
	'APP_DEBUG'				=> true,
	
	//LSE查询引擎
	'LSE'=> 'http://qlse.amap.com/',//'LSE'=> 'http://172.17.41.225:88/cgi-bin/'
	//MRE渲染引擎
	'MRE'=> 'http://172.17.41.241/mr.py',
	//三级行政区划渲染
	'XZH'=> 'http://172.17.41.241:8001/'
);
return $config;
?>
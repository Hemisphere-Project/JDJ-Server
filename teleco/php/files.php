<?

// CONFIG
$files_path = '../../files/';
$base_url = 'http://'.$_SERVER['SERVER_NAME'].':8080/files/';


function isExtValid($file, $type=null) {
	
	$types['video'] = ['mp4', 'avi', 'mov'];
	$types['audio'] = ['mp3', 'wav', 'aiff'];
	$types['image'] = ['jpg', 'jpeg', 'png', 'gif'];
	$types['raw'] = ['sms', 'pad', 'url', 'txt', 'phone'];

	if ($type == null) return isExtValid($file, 'media') 
									or isExtValid($file, 'raw');

	if ($type == 'media') return isExtValid($file, 'audio') 
									or isExtValid($file, 'video') 
									or isExtValid($file, 'image');
	
	$ext = pathinfo($file, PATHINFO_EXTENSION);
	if (array_key_exists($type, $types)) 
		return in_array($ext, $types[$type]);

	return false;
}

function clean_string($str, $encoding='utf-8')
{
  // transformer les caractères accentués en entités HTML
  $str = htmlentities($str, ENT_NOQUOTES, $encoding);
  // remplacer les entités HTML ( "&ecute;" => "e", "&Ecute;" => "E", "Ã " => "a" ... )
  $str = preg_replace('#&([A-za-z])(?:acute|grave|cedil|circ|orn|ring|slash|th|tilde|uml);#', '\1', $str);
  // Remplacer les ligatures tel que : Œ, Æ ... ("Å“" => "oe")
  $str = preg_replace('#&([A-za-z]{2})(?:lig);#', '\1', $str);
  // Supprimer tout ce qui n'est pas a-z A-Z 0-9 _ ET POINTS !!!!
  $str = preg_replace("/[^a-zA-Z0-9_.]+/", "", html_entity_decode($str, ENT_QUOTES));
  return $str;
}

function rmDirectory($dir) { 
    $files = array_diff(scandir($dir), array('.', '..')); 
    foreach ($files as $file)
        (is_dir($dir.'/'.$file)) ? rmDirectory($dir.'/'.$file) : unlink($dir.'/'.$file); 
    return rmdir($dir); 
} 


//ACTION
if (array_key_exists('action', $_POST)) $action = $_POST['action'];
else $action = $_GET['action'];


// UPLOAD
if ($action == 'upload') {
	
	// MULTIPLE FILES Upload
	for($i=0; $i<count($_FILES); $i++) 
	{
		$newname = clean_string($_FILES[$i]['name']);
		if (isExtValid($newname, 'media')) 
		{
			move_uploaded_file($_FILES[$i]['tmp_name'], $files_path.$newname);
			echo 'file '.$newname.' uploaded';

			// VIDEO: Create HLS Variant
			if (isExtValid($newname, 'video')) {
				echo ' // '.$newname.' HLS variants in progress';
				exec('../../hls/segmenter -i '.$files_path.$newname.' -u '.$base_url.' > /dev/null 2>&1 & ');
			}
		}
		else echo 'wrong file type';
	}

}

// SAVE
elseif ($action == 'save') {
	$ext = strtolower($_POST['extension']);
	$newname = clean_string($_POST['filename']).'.'.$ext;
	$contents = $_POST['contents'];

	if (isExtValid($newname, 'raw')) {
		file_put_contents($files_path.$newname, $contents);
		echo 'success';
	}
	else echo 'wrong file type';
}

// LOAD
elseif ($action == 'load') {
	$filename = $_POST['filename'];
	if (isExtValid($filename, 'raw')) {
		$contents = file_get_contents($files_path.$filename);
		echo $contents;
	}
}

// RENAME
elseif ($action == 'rename') {

	$ext = pathinfo($_POST['oldname'], PATHINFO_EXTENSION);
	$oldfilename = pathinfo($_POST['oldname'], PATHINFO_FILENAME);
	$newfilename = pathinfo($_POST['newname'], PATHINFO_FILENAME);

	// RENAME File
	$oldfile = $files_path.$oldfilename.'.'.$ext;
	$newfile = $files_path.$newfilename.'.'.$ext;
	if (isExtValid($oldfile)) {
		rename($oldfile,$newfile);

		// RENAME HLS Variant
		$oldhlsdir = $files_path.$oldfilename;
		$newhlsdir = $files_path.$newfilename;
		if (rename($oldhlsdir, $newhlsdir)) {
			rename($newhlsdir.'/'.$oldfilename.'.mp4', $newhlsdir.'/'.$newfilename.'.mp4');
			rename($newhlsdir.'/'.$oldfilename.'.m3u8', $newhlsdir.'/'.$newfilename.'.m3u8');

			$str=file_get_contents($newhlsdir.'/'.$newfilename.'.m3u8');
			$str=str_replace("/".$oldfilename."/", "/".$newfilename."/", $str);
			file_put_contents($newhlsdir.'/'.$newfilename.'.m3u8', $str);
		}
	}	
}

// DELETE
elseif ($action == 'delete') {

	$ext = pathinfo($_POST['fileName'], PATHINFO_EXTENSION);
	$filename = pathinfo($_POST['fileName'], PATHINFO_FILENAME);
	$file = $files_path.$filename.'.'.$ext;

	if (isExtValid($file))
		if (unlink($file))						// DELETE The File
			rmDirectory($files_path.$filename); // DELETE HLS Variants
}

// LIST
elseif ($action == 'list') {
	$files = array_filter(scandir($files_path), function($item) use($types, $files_path) {
					return (!is_dir($files_path.$item) && $item[0] !== '.' && isExtValid($item));
				});
	sort($files);
	echo json_encode($files);
}





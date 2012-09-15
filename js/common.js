// JavaScript Document
var map,tool,ditu={},searchCate={},searchType="",_keywords=[],_page="";

$(function(){
	resize();
	mapInit();
	share();
	
	//关键词查询表单
	$("input[type=text]").blur(function(){
		$(this).css("borderColor","#A09E99");
	}).focus(function(){
		$(this).css("borderColor","#4D90FE");
	});
	//功能分类
	$(".search-cate>li").click(function(){
		$(".search-cate>li").removeClass("link");
		$(this).addClass("link");
		$(".ct").hide().eq($(".search-cate>li").index($(this))).show();
		var cate = $(this).attr("cate");
		//加载JS
		if(ditu[cate]){return false;}
		$.getScript("js/"+cate+"-Search.js",function(e){
			ditu[cate] = new searchCate[cate]();
		});
	}).eq(0).click();
	//折叠左侧
	$(".right-toggle").click(function(){
		var node = $(this).find("img");
		if(node.hasClass("right")){
			$(".layout-left").css("width","380px").show();
			$(".layout-right").css("width",$(window).width()-381);
		}else{
			$(".layout-left").hide();
			$(".layout-right").css("width",$(window).width()-2);
		}
		node.toggleClass("right");
	});
	//表单事件
	$("form[name=myform]").submit(function(){
		ditu.poi.search($(this).val());
		$(".ct:eq(0)").show();
		return false;
	});
	//自动完成
	$(".top-search").find("input[name=keywords]").autoPrompts({
		source: "c.php/Server/autoPrompts",
		minLength: 2
	});
});
$(window).resize(function(){
	resize();
});
//顶部工具
var Map = {
	screenShot:function(){
		$.getScript("js/jquery.Jcrop.js",function(){
			$(".layout-map").Jcrop({
				addClass: 'jcrop-dark',
				onChange: detail,
				onSelect: delDiv,
				onDblClick: ok
			},function(){
				jcrop_api = this;
			});
		});
		function detail(c){
			if($(".area_size").length<1){
				var m = document.createElement("div");
				m.className = "area_size";
				m.style.background = "#000";
				m.style.color = "#fff";
				m.style.zIndex = 600;
				m.style.left = (c.x+5)+"px";
				m.style.top = (c.y-20)+"px";
				m.style.width = "60px";
				m.style.height = "20px";
				m.style.lineHeight = "20px";
				m.style.position = "relative";
				m.style.display = "block";
				m.style.textAlign = "center";
				$(".jcrop-holder").append(m);
			}else{
				$(".area_size").html(c.w+'x'+c.h);
				$(".area_size").css("left",(c.x+5)+"px");
				$(".area_size").css("top",(c.y-20)+"px");
			}
			
			if($(".cap_btn_conbg").length<1){
				var m = document.createElement("div");
				m.id = "cap_btn_container";
				var n = document.createElement("div");
				var l = document.createElement("div");
				var a = document.createElement("span");
				a.id = "cap_btn_cancel";
				a.className = "";
				var b = document.createElement("span");
				b.id = "cap_btn_show";
				b.className = "";
				var c = document.createElement("span");
				c.id = "cap_btn_save";
				c.className = "";
				n.className = "cap_btn_conbg";
				m.style.left = (c.x2-177)+"px";
				m.style.top = (c.y2-15)+"px";
				l.appendChild(a);
				l.appendChild(b);
				l.appendChild(c);
				n.appendChild(l);
				m.appendChild(n);
				$(".jcrop-holder").append(m);
				
				$(".cap_btn_conbg").find('span').mouseover(function(e) {
                    $(this).addClass("hover");
					$(this).siblings().removeClass("hover");
                });
				
				$(".cap_btn_conbg").find('span').mouseout(function(e) {
                    $(this).removeClass("hover");
                });
				
				$("#cap_btn_cancel").click(function(e) {
                    cancel();
                });
				
				$("#cap_btn_show").click(function(e) {
					var bounds = map.getBounds();
					var southwest = bounds.southwest;
					var northeast = bounds.northeast;
					var wnlng = southwest.lng;
					var wnlat = northeast.lat;
					var eslng = northeast.lng;
					var eslat = southwest.lat;
					var z = map.getZoom();
					var x = parseInt($(".jcrop-selection").css("left"));
					var y = parseInt($(".jcrop-selection").css("top"));
					var x2 = parseInt($(".jcrop-selection").css("left"))+parseInt($(".jcrop-selection").css("width"));
					var y2 = parseInt($(".jcrop-selection").css("top"))+parseInt($(".jcrop-selection").css("height"));
		
					window.open("c.php/Tiles/wbln?wnlng="+wnlng+"&wnlat="+wnlat+"&eslng="+eslng+"&eslat="+eslat+"&x="+x+"&y="+y+"&x2="+x2+"&y2="+y2+"&z="+z);
					$(".area_size").remove();
					$("#cap_btn_container").remove();
					$(".jcrop-holder").find(":radio").remove();
					$(".jcrop-selection").remove();
					$(".layout-map").unwrap();
					jcrop_api.destroy();
                });
				
				$("#cap_btn_save").click(function(e) {
                    var bounds = map.getBounds();
					var southwest = bounds.southwest;
					var northeast = bounds.northeast;
					var wnlng = southwest.lng;
					var wnlat = northeast.lat;
					var eslng = northeast.lng;
					var eslat = southwest.lat;
					var z = map.getZoom();
					var x = parseInt($(".jcrop-selection").css("left"));
					var y = parseInt($(".jcrop-selection").css("top"));
					var x2 = parseInt($(".jcrop-selection").css("left"))+parseInt($(".jcrop-selection").css("width"));
					var y2 = parseInt($(".jcrop-selection").css("top"))+parseInt($(".jcrop-selection").css("height"));
		
					window.open("c.php/Tiles/screenShot?wnlng="+wnlng+"&wnlat="+wnlat+"&eslng="+eslng+"&eslat="+eslat+"&x="+x+"&y="+y+"&x2="+x2+"&y2="+y2+"&z="+z);
					$(".area_size").remove();
					$("#cap_btn_container").remove();
					$(".jcrop-holder").find(":radio").remove();
					$(".jcrop-selection").remove();
					$(".layout-map").unwrap();
					jcrop_api.destroy();
                });
			}else{
				$("#cap_btn_container").css("left",(c.x2-177)+"px");
				$("#cap_btn_container").css("top",(c.y2-15)+"px");
			}
		}
		function delDiv(){
			$("#delDiv").remove();
		}
		function ok(c){
			var bounds = map.getBounds();
			var southwest = bounds.southwest;
			var northeast = bounds.northeast;
			var wnlng = southwest.lng;
			var wnlat = northeast.lat;
			var eslng = northeast.lng;
			var eslat = southwest.lat;
			var z = map.getZoom();

			window.open("c.php/Tiles/wbln?wnlng="+wnlng+"&wnlat="+wnlat+"&eslng="+eslng+"&eslat="+eslat+"&x="+c.x+"&y="+c.y+"&x2="+c.x2+"&y2="+c.y2+"&z="+z);
			$(".area_size").remove();
			$("#cap_btn_container").remove();
			$(".jcrop-holder").find(":radio").remove();
			$(".jcrop-selection").remove();
			$(".layout-map").unwrap();
			jcrop_api.destroy();
		}
		function cancel(){
			$(".area_size").remove();
			$("#cap_btn_container").remove();
			$(".jcrop-holder").find(":radio").remove();
			$(".jcrop-selection").remove();
			$(".layout-map").unwrap();
			jcrop_api.destroy();
		}
	},
	printMap:function(){
		window.print();
	},
	surveyLine:function(){
		var mouse = new AMap.MouseTool(map);
		mouse.rule();
		var cl = function(){
			mouse.close();
		}
		map.bind(mouse,"draw",cl);
	},
	fullScreen:function(){
		$(".right-toggle").click();
	},
	clearMap:function(){
		map.clearMap();
	},
	share:function(){
		var action = searchType;
		var center = map.getCenter().lng+';'+map.getCenter().lat;
		var zoom = map.getZoom();
		if(action == 'poi'){
			var keywords = $.trim($("input.k").val())+";"+$(".Partion>div").find("a:last").text()+";"+$(".Category>div").find("a:last").text();
		}else if(action == 'bus'){
			var a=[],k=$("input[name=bus]");
			a.push(k.eq(0).val());
			a.push(k.eq(1).val());
			keywords = a.join(';');
		}else if(action == 'route'){
			var b = [];
			for(var i=0;i<_keywords.length;i++){
				if(_keywords[i].poi){
					var a=[];
					a.push(_keywords[i].poi.lng);
					a.push(_keywords[i].poi.lat);
					b[i]=a.join(',');
				}else{
					var a=[];
					a.push(_keywords[i].lng);
					a.push(_keywords[i].lat);
					b[i]=a.join(',');
				}
			}
			keywords = b.join(';');
		}
		if(action != ""){
			$.ajax({
				type: 'POST',
				url: 'c.php/Server/share',
				data: {
					action:action,
					center:center,
					zoom:zoom,
					page:_page,
					keywords:keywords
				},
				dataType: 'json',
				success: function(data){
					if(data.status == 1){
						var n = '<div style="width: 350px; display: block; height: 65px; right: 5px; top: 5px;" class="map_popup"><div class="popup_main"><div class="title">您可将当前地图上的内容分享给好友</div><div class="content" style="height: 61px; overflow-y: auto;"><div id="mapshare_container" class="mapshare_container"><span style="display: none;" id="getLinkF">复制成功</span><div id="getLinkBtnCon"><span id="getLinkBtnSpan" class=""></span></div><input type="text" value="正在获取..." id="linkText" class="getLinkInput"></div></div><button title="关闭" id="popup_close"></button></div><div class="poput_shadow" style="height: 65px;"></div></div>';
						if($(".map_popup").length<1){
							$(".layout-map").append(n);
						}
						var link = location.href.split('?');
						var url = link[0]+'?url='+data.url;
						$("#getLinkF").hide();
						$("#linkText").val(url);
						$("#popup_close").click(function(e) {
                            $(".map_popup").remove();
                        });
						$.getScript("js/ZeroClipboard.js",function(e){
							ZeroClipboard.setMoviePath("js/ZeroClipboard.swf");
							clip = new ZeroClipboard.Client();
							clip.setHandCursor( true );
							
							clip.addEventListener('mouseDown', function (client) {
								$("#getLinkBtnSpan").addClass('down');
							});
							clip.addEventListener('mouseUp', function (client) {
								$("#getLinkBtnSpan").removeClass('down');
							});
							clip.addEventListener('complete', function (client, text) {
								$("#getLinkF").show();
							});
							clip.setText($('#linkText').val());
							clip.glue('getLinkBtnSpan');
						});
					}
				}
			});
		}
	}
};
// 布局
function resize(){
	var w = $(window).width();
	var h = $(window).height();
	$(".layout").css("width",w+"px").css("height",h+"px");
	$(".layout-left,.shadow-left").css("height",h-85+"px");
	$(".layout-right").css("width",w-381+"px").css("height",h-86+"px");
	$(".ct").css("height",h-120+"px");
}
// 地图初始化
function mapInit(){
	map = new AMap.Map($(".layout-map")[0]);
	
	map.setZoom(4);
	
	map.plugin(["AMap.ToolBar","AMap.Scale","AMap.OverView","AMap.MouseTool"],function(){
		tool = new AMap.ToolBar({
			offset:new AMap.Pixel(15,15),
			autoPosition:false
		});
		map.addControl(tool);
		
		var scale = new AMap.Scale();
		map.addControl(scale);
		
		var view = new AMap.OverView();
		map.addControl(view);
	});
}
function share(){
	var url = window.location.href.split('=');
	if(url[1] != null){
		$.ajax({
			type: 'POST',
			url: 'c.php/Server/getUrl',
			data: {
				url:url[1]
			},
			dataType: 'json',
			success: function(data){
				if(data.status == 1){
					if(data.message.action == 'poi'){
						var center = data.message.center.split(';');
						var keywords = data.message.keywords.split(';');
						$("input.k").val(keywords[0]);
						//searchCate.poi.prototype.outsearch(keywords[0],keywords[1],keywords[2]);
						$.getScript("js/poi-Search.js",function(e){
							ditu['poi'] = new searchCate['poi']();
							searchCate.poi.prototype.outsearch(keywords[0],keywords[1],keywords[2],data.message.page);
						});
					}else if(data.message.action == 'bus'){
						var center = data.message.center.split(';');
						var keywords = data.message.keywords.split(';');
						$(".search-cate li:eq(1)").click();
						$.getScript("js/bus-Search.js",function(e){
							$(".widget-place").find(":input").each(function(i) {
								$(this).val(keywords[i]);
							});
							
							$(".bus-button").click();
							map.setZoom(data.message.zoom);
							map.setCenter(new AMap.LngLat(center[0],center[1]));
						});
					}else if(data.message.action == 'route'){
						
						
						$.getScript("js/route-Search.js",function(e){
							ditu['route'] = new searchCate['route']();
							var center = data.message.center.split(';');
							var lnglat = data.message.keywords.split(';');
							$(".search-cate li:eq(2)").click();
							input_num = $(".widget-place").find(":input").length;
							if(input_num < lnglat.length){
								var differ = lnglat.length-input_num;
								for(var i=0;i<differ;i++){
									searchCate.route.prototype.outLine();
								}
							}
							$.ajax({type:"GET",dataType:"json",data:{lnglat:data.message.keywords},url:"c.php/Server/allrgeocode",
								success:function(data){
									for(var i=0;i<data.length;i++){
										$("input[name=route]").each(function(k) {
											 if(k == i){
												 $(this).val(data[i]);
											 }
										});
									}
								}
							});
							var path = [];
							for(var i=0;i<lnglat.length;i++){
								var xy =lnglat[i].split(',');
								path.push(new AMap.LngLat(xy[0],xy[1]));
							}
							$.getScript("js/DragRoute.js",function(e){
								route = new DragRoute(map,path);
								route.search();
							});
							map.setZoom(data.message.zoom);
							map.setCenter(new AMap.LngLat(center[0],center[1]));
						});
					}
				}
			}
		});
	}
}
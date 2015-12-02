import java.util.Locale;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class TestController {

	/** This is used for uploading a chunk of data and test the upload speed. It does nothing, it just returns "true". */
	@RequestMapping("/test-post")
	public @ResponseBody String testPost() {
		return "true";
	}

}
